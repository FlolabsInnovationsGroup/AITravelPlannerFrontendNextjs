// import Image from 'next/image'

// const cities = [
//   { name: "New York", image: "/new-york.jpg", tours: 120 },
//   { name: "London", image: "/images/london.jpg", tours: 100 },
//   { name: "Paris", image: "/images/paris.jpg", tours: 90 },
//   { name: "Tokyo", image: "/images/tokyo.jpg", tours: 110 },
// ]

// export function TopCities() {
//   return (
//     <section className="py-16 bg-white">
//       <div className="container mx-auto px-4">
//         <h2 className="text-3xl font-bold mb-8">Top Cities</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           {cities.map((city, index) => (
//             <div key={index} className="relative aspect-[3/4] group overflow-hidden rounded-lg">
//               <Image
//                 src={city.image}
//                 alt={city.name}
//                 layout="fill"
//                 objectFit="cover"
//                 className="transition-transform duration-300 group-hover:scale-110"
//               />
//               <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
//               <div className="absolute bottom-0 left-0 right-0 p-4">
//                 <h3 className="text-white font-semibold text-xl">{city.name}</h3>
//                 <p className="text-white">{city.tours} tours</p>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   )
// }

"use client"

import { useState, useRef } from 'react'
import Image from "next/legacy/image"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from 'lucide-react'

const cities = [
  { name: "New York", image: "/new-york.jpg", tours: 100 },
  { name: "Paris", image: "/image/paris.jpg", tours: 90 },
  { name: "Tokyo", image: "/image/tokyo.jpg", tours: 110 },
  { name: "Rome", image: "/image/rome.jpg", tours: 95 },
  { name: "Sydney", image: "/image/sydney.jpg", tours: 85 },
  { name: "Dubai", image: "/image/dubai.jpg", tours: 105 },
  { name: "Mumbai", image: "/image/mumbai.jpg", tours: 115 },
  { name: "Cape Town", image: "/image/cape-town.jpg", tours: 90 },
  { name: "Barcelona", image: "/image/barcelona.jpg", tours: 100 },
  { name: "Prague", image: "/image/prague.jpg", tours: 80 },
  { name: "Vienna", image: "/image/vienna.jpg", tours: 75 },
  { name: "Amsterdam", image: "/image/amsterdam.jpg", tours: 95 },
  { name: "Lisbon", image: "/image/lisbon.jpg", tours: 85 },
  
]

export function TopCities() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth / 2
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">Top Cities</h2>
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex overflow-x-auto space-x-6 no-scrollbar"
            onScroll={checkScroll}
          >
            {cities.map((city, index) => (
              <div key={city.name} className="flex-none w-64">
                <div className="relative aspect-[3/4] group overflow-hidden rounded-lg">
                  <Image
                    src={city.image}
                    alt={city.name}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold text-xl">{city.name}</h3>
                    <p className="text-white">{city.tours} tours</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {canScrollLeft && (
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {canScrollRight && (
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}