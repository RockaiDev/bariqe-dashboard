import { Icon } from "@iconify/react";



// navigation links
export const navigationLinks = [
  { nameKey: "navigation.home", href: "/" },
  { nameKey: "navigation.allProducts", href: "/all-products" },
  { nameKey: "navigation.offersPackages", href: "/all-products?category=692d98993f403d6f98c82e9b" },
  { nameKey: "navigation.about", href: "/about" },
  { nameKey: "navigation.contact", href: "/contact" },


];

export const contactWithUs = [
  { titleKey: "phone", icon: <Icon icon="mdi:phone" width="20" />, link: 'tel:+9660506713071' },
  { titleKey: "whatsapp", icon: <Icon icon="mdi:whatsapp" width="20" />, link: 'https://api.whatsapp.com/send/?phone=%2B966539474864&type=phone_number&app_absent=0' },
  { titleKey: "address", icon: <Icon icon="mdi:map-marker" width="20" />, link: `https://www.google.com/maps/place/19%C2%B051'55.0%22N+42%C2%B037'06.4%22E/@19.8652668,42.61586,17z/data=!3m1!4b1!4m4!3m3!8m2!3d19.8652668!4d42.6184349?entry=ttu&g_ep=EgoyMDI1MTEyMy4xIKXMDSoASAFQAw%3D%3D` },
  { titleKey: "email", icon: <Icon icon="ic:baseline-email" width="20" />, link: `mailto:info@bariqeeltamioz.com` },
]

// https://api.whatsapp.com/send/?phone=%2B966501234567&type=phone_number&app_absent=0

export const CONTACTPHONE = "+966-53-947-4864";
export const CONTACTMAIL = "info@bariqeeltamioz.com"


