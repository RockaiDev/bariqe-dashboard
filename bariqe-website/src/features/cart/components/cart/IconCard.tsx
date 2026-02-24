import { Card } from '@/shared/components/ui/card';

export const IconCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <Card
      className='p-4'
    >{children}</Card>
  )
}
