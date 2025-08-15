import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    // Immediately redirect to dashboard
    router.replace('/dashboard')
  }, [router])
  
  // Show loading while redirecting
  return (
    <>
      <Head>
        <title>VoiCRM - Loading...</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#636B56] to-[#864936]">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">VoiCRM</h1>
          <p className="text-white/80">Loading dashboard...</p>
        </div>
      </div>
    </>
  )
}