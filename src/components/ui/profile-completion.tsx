import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'

// Fields to check and their weights
const FIELD_WEIGHTS = {
  avatar_url: { weight: 20, label: 'Profile Photo' },
  about_me: { weight: 15, label: 'About Me' },
  city: { weight: 10, label: 'City' },
  education: { weight: 10, label: 'Education' },
  profession: { weight: 10, label: 'Profession' },
  income: { weight: 10, label: 'Income' },
  diet: { weight: 5, label: 'Diet' },
  membership_number: { weight: 10, label: 'Membership Number' },
  religion: { weight: 5, label: 'Religion' },
  photo_visibility: { weight: 5, label: 'Photo Visibility' }
}

export function ProfileCompletion({ profile, className }: { profile: any, className?: string }) {
  if (!profile) return null

  let score = 0
  const missingFields: { key: string, label: string }[] = []

  Object.entries(FIELD_WEIGHTS).forEach(([key, { weight, label }]) => {
    if (profile[key] !== null && profile[key] !== undefined && profile[key] !== '') {
      score += weight
    } else {
      missingFields.push({ key, label })
    }
  })

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Profile Completeness</span>
          <span className="text-primary font-bold">{score}%</span>
        </CardTitle>
        <CardDescription>A complete profile gets 3x more matches.</CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
          <div className="bg-primary h-2.5 rounded-full" style={{ width: `${score}%` }}></div>
        </div>
        {missingFields.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-sm text-gray-500 mr-1 py-1">Missing:</span>
            {missingFields.slice(0, 5).map(field => (
              <Badge key={field.key} variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                {field.label}
              </Badge>
            ))}
            {missingFields.length > 5 && (
              <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200">
                +{missingFields.length - 5} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      {missingFields.length > 0 && (
        <CardFooter>
          <Link href="/profile/edit?highlight=missing" className="w-full">
            <Button variant="default" className="w-full">
              Complete Profile <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  )
}
