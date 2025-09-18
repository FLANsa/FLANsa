import React from 'react'

type ErrorBoundaryState = { hasError: boolean; error?: any }

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, errorInfo: any) {
    // eslint-disable-next-line no-console
    console.error('App crashed:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2 style={{ color: '#b91c1c', fontWeight: 700 }}>حدث خطأ غير متوقع</h2>
          <p style={{ color: '#374151', marginTop: 8 }} className="arabic">الرجاء إعادة تحميل الصفحة. إن استمر، أرسل لنا رسالة الخطأ التالية.</p>
          {this.state.error && (
            <pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 8, marginTop: 12, overflow: 'auto' }}>
{String(this.state.error && (this.state.error.stack || this.state.error.message || this.state.error))}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}



