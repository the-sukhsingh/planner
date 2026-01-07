"use client"
import PlanInterface from '@/components/Plan/PlanInterface'
import { useRouter } from 'next/navigation'
const Page = () => {
  const router = useRouter()
  const handleId = (id: string) => {
    // Set url param
    router.replace(`/plans?id=${id}`)
  }

  return (
    <PlanInterface setId={handleId} />
  )
}

export default Page