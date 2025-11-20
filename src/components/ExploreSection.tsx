"use client"

import { useState, useRef } from 'react'
import Image from "next/legacy/image"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from 'lucide-react'

const places = [
  { name: "Nanjing, China", image: "/image/nanjing.jpg" },
  { name: "Brasilia, Brazil", image: "/image/brasilia.jpg" },
  { name: "Rome, Italy", image: "/image/rome.jpg" },
  { name: "Paris, France", image: "/image/paris.jpg" },
  { name: "New York, USA", image: "/new-york.jpg" },
  { name: "Tokyo, Japan", image: "/image/Fuji.jpg" },
]

export function ExploreSection() {
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
    <section className="py-16 bg-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-lg font-semibold text-blue-500 mb-2">EXPLORE</h2>
        <div className="flex justify-between items-start mb-8">
          <h3 className="text-3xl font-bold max-w-xl">
            Explore all corners of the world with us.
          </h3>
          <p className="text-gray-600 max-w-md">
            Start a new adventure and explore the hidden gems of the world to create memories for a lifetime.
          </p>
        </div>
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex overflow-x-auto space-x-6 no-scrollbar"
            onScroll={checkScroll}
          >
            {places.map((place) => (
              <div key={place.name} className="flex-none w-72">
                <div className="relative aspect-[4/3] mb-4">
                  <Image
                    src={place.image}
                    alt={place.name}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-lg"
                  />
                </div>
                <h4 className="text-lg font-semibold">{place.name}</h4>
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