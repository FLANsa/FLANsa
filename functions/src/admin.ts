import { onRequest } from "firebase-functions/v2/https";
import { HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

async function verifyAccess(req: any) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    throw new HttpsError("unauthenticated", "Missing Bearer token");
  }
  const idToken = authHeader.replace("Bearer ", "");
  const decoded = await getAuth().verifyIdToken(idToken);
  const email = decoded.email || "";
  const role = (decoded as any).role || (decoded as any).claims?.role;
  const isOwner = role === "owner";
  const isSuperAdmin = email.toLowerCase() === "admin@qayd.com";
  if (!isOwner && !isSuperAdmin) {
    throw new HttpsError("permission-denied", "Not authorized");
  }
  return { uid: decoded.uid, email, role };
}

function parsePath(pathname: string) {
  // Expected base: /api/admin/... (hosting rewrite), but accept any
  const parts = pathname.split("?")[0].split("/").filter(Boolean);
  // Find index of "admin" to be robust
  const idx = parts.indexOf("admin");
  const segs = idx >= 0 ? parts.slice(idx + 1) : parts;
  return segs; // e.g., ["users",":uid"]
}

export const adminApi = onRequest({ cors: true }, async (req, res) => {
  try {
    const method = req.method as HttpMethod;
    const segs = parsePath(req.path || req.url || "");
    await verifyAccess(req);

    const db = getFirestore();
    const auth = getAuth();

    // USERS
    if (segs[0] === "users" && method === "POST" && segs.length === 1) {
      const { email, password = "123456", name = "", role = "cashier", tenantId = "", isActive = true } = req.body || {};
      if (!email || !tenantId) throw new HttpsError("invalid-argument", "email and tenantId required");
      const userRecord = await auth.createUser({ email, password, disabled: !isActive });
      await auth.setCustomUserClaims(userRecord.uid, { role, tenantId, isActive });
      await db.collection("users").doc(userRecord.uid).set({
        id: userRecord.uid, tenantId, name, email, role, isActive, createdAt: new Date(), updatedAt: new Date()
      });
      res.json({ ok: true, uid: userRecord.uid });
      return;
    }

    if (segs[0] === "users" && segs[1] === "test" && method === "POST") {
      const email = `test_${Date.now()}@qayd.com`;
      const password = "123456";
      const user = await auth.createUser({ email, password, disabled: true });
      await auth.deleteUser(user.uid);
      res.json({ ok: true });
      return;
    }

    if (segs[0] === "users" && segs[1] && method === "PATCH") {
      const uid = segs[1];
      const { role, isActive } = req.body || {};
      if (typeof isActive === "boolean") {
        await auth.updateUser(uid, { disabled: !isActive });
      }
      const currentClaims = (await auth.getUser(uid)).customClaims || {};
      await auth.setCustomUserClaims(uid, { ...currentClaims, ...(role ? { role } : {}), ...(typeof isActive === "boolean" ? { isActive } : {}) });
      const userRef = db.collection("users").doc(uid);
      await userRef.set({ ...(role ? { role } : {}), ...(typeof isActive === "boolean" ? { isActive } : {}), updatedAt: new Date() }, { merge: true });
      res.json({ ok: true });
      return;
    }

    if (segs[0] === "users" && segs[1] && method === "DELETE") {
      const uid = segs[1];
      await auth.deleteUser(uid);
      await db.collection("users").doc(uid).delete();
      res.json({ ok: true });
      return;
    }

    // TENANTS
    if (segs[0] === "tenants" && method === "POST" && segs.length === 1) {
      const tenant = req.body || {};
      if (!tenant.name || !tenant.nameAr) throw new HttpsError("invalid-argument", "tenant name/nameAr required");
      tenant.isActive = tenant.isActive !== false;
      tenant.createdAt = new Date();
      tenant.updatedAt = new Date();
      const ref = await db.collection("tenants").add(tenant);
      res.json({ ok: true, id: ref.id });
      return;
    }

    if (segs[0] === "tenants" && segs.length === 1 && method === "GET") {
      const snap = await db.collection("tenants").get();
      const tenants = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      res.json({ ok: true, tenants });
      return;
    }

    if (segs[0] === "tenants" && segs[1] && segs.length === 2 && method === "GET") {
      const tenantId = segs[1];
      const tDoc = await db.collection("tenants").doc(tenantId).get();
      if (!tDoc.exists) {
        res.status(404).json({ ok: false, error: "not-found" });
        return;
      }
      const usersSnap = await db.collection("users").where("tenantId", "==", tenantId).get();
      const ordersSnap = await db.collection("orders").where("tenantId", "==", tenantId).get();
      const revenue = ordersSnap.docs.reduce((sum, d) => sum + (Number((d.data() as any).total) || 0), 0);
      res.json({ ok: true, tenant: { id: tDoc.id, ...tDoc.data() }, stats: { users: usersSnap.size, orders: ordersSnap.size, revenue } });
      return;
    }

    // SETTINGS
    if (segs[0] === "tenants" && segs[2] === "settings" && method === "PUT") {
      const tenantId = segs[1];
      const settings = req.body || {};
      await db.collection("settings").doc(tenantId).set({ ...settings, tenantId, updatedAt: new Date() }, { merge: true });
      res.json({ ok: true });
      return;
    }

    // STATS
    if (segs[0] === "stats" && method === "GET") {
      const [usersSnap, tenantsSnap, ordersSnap] = await Promise.all([
        db.collection("users").get(),
        db.collection("tenants").get(),
        db.collection("orders").get(),
      ]);
      const totalUsers = usersSnap.size;
      let activeUsers = 0;
      let inactiveUsers = 0;
      usersSnap.forEach(d => ((d.data() as any).isActive ? activeUsers++ : inactiveUsers++));
      const totalTenants = tenantsSnap.size;
      const totalOrders = ordersSnap.size;
      const totalRevenue = ordersSnap.docs.reduce((sum, d) => sum + (Number((d.data() as any).total) || 0), 0);
      res.json({ ok: true, totals: { totalUsers, activeUsers, inactiveUsers, totalTenants, totalOrders, totalRevenue } });
      return;
    }

    res.status(404).json({ ok: false, error: "route-not-found", path: req.path, segs });
    return;
  } catch (err: any) {
    const code = err.code === "permission-denied" ? 403 : err.code === "unauthenticated" ? 401 : 500;
    res.status(code).json({ ok: false, error: err.message || String(err) });
    return;
  }
});


