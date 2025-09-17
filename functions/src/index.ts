import { onRequest } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { initializeApp } from "firebase-admin/app";

// Initialize Firebase Admin
initializeApp();

export const setUserRoles = onRequest(async (req, res) => {
  try {
    const auth = getAuth();
    
    // Set admin role
    await auth.setCustomUserClaims("JFxyG7C60ySFOnwDitlvmUNSyF", { role: "admin" });
    
    // Set manager role
    await auth.setCustomUserClaims("IzamcdZ0IHeGNHWIMxAFLTqsVMz2", { role: "manager" });
    
    // Set cashier role
    await auth.setCustomUserClaims("0mlMcyasVpbYayQRgCoRlfPUvxv1", { role: "cashier" });
    
    res.json({ 
      success: true, 
      message: "User roles set successfully",
      users: {
        admin: "JFxyG7C60ySFOnwDitlvmUNSyF",
        manager: "IzamcdZ0IHeGNHWIMxAFLTqsVMz2", 
        cashier: "0mlMcyasVpbYayQRgCoRlfPUvxv1"
      }
    });
  } catch (error) {
    console.error("Error setting user roles:", error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});