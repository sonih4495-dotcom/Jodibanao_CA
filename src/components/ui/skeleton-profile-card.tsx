import React from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'

export function SkeletonProfileCard() {
  return (
    <Card className="overflow-hidden animate-pulse border-gray-200">
      <div className="aspect-square bg-gray-200 w-full" />
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-2 w-full">
            <div className="h-5 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
          <div className="h-6 bg-gray-200 rounded-full w-12" />
        </div>
        <div className="space-y-2 mt-4">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-4/5" />
        </div>
        <div className="flex gap-2 mt-4">
          <div className="h-6 bg-gray-200 rounded-full w-16" />
          <div className="h-6 bg-gray-200 rounded-full w-20" />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="h-10 bg-gray-200 rounded-md w-full" />
      </CardFooter>
    </Card>
  )
}

export function SkeletonProfileGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProfileCard key={i} />
      ))}
    </div>
  )
}
