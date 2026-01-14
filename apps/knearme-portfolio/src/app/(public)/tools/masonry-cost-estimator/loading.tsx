import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function MasonryCostEstimatorLoading() {
  return (
    <div className='container mx-auto px-4 py-10 max-w-4xl'>
      <Card className='border-0 shadow-sm'>
        <CardContent className='space-y-4 py-8'>
          <Skeleton className='h-8 w-2/3' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-5/6' />
        </CardContent>
      </Card>
    </div>
  )
}

