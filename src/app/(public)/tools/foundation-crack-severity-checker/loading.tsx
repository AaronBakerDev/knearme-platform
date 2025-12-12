export default function Loading() {
  return (
    <div className='container mx-auto px-4 py-10'>
      <div className='max-w-3xl mx-auto space-y-4 animate-pulse'>
        <div className='h-8 w-2/3 rounded bg-muted' />
        <div className='h-4 w-full rounded bg-muted' />
        <div className='h-4 w-5/6 rounded bg-muted' />
      </div>
    </div>
  )
}

