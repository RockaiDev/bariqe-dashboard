import React from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { Facebook } from 'lucide-react'

const socials=[
  {
    icon: <Icon icon="mdi:instagram" className="text-white" width="30" /> , url:'https://www.instagram.com/nolicksa?igsh=amIzd2oyN2hxZmkx&utm_source=qr'
  },
  {
    icon: <Facebook/> , url:'https://www.facebook.com/share/1KZpSQMoLP/?mibextid=wwXIfr'
  },

  {
    icon: <img src='/tiktok.svg' className='text-white'  width={30} height={30}/> , url:'https://www.tiktok.com/@nolicksa?_r=1&_t=ZS-91rgQ4kSCvM'
  }
]
const SocialCards = ({color='white'}:{color?: string}) => {
  return (
    <div className={`flex items-center justify-center gap-3 text-${color}`}>
      {socials.map((item , index)=>
      <Link target='_blank' href={item.url} key={index}>{item.icon}</Link>)}
    </div>
  )
}

export default SocialCards
