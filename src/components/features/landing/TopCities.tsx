"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const cities = [
  { name: "New York", image: "/image/newnewyork.jpg", sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" },
  { name: "Paris", image: "/image/newparis.jpg", sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" },
  { name: "Tokyo", image: "/image/newtokyo.jpg", sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" },
  { name: "Rome", image: "/image/newrome.jpg", sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" },
  { name: "Sydney", image: "/image/newsydney.jpg", sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" },
  { name: "Dubai", image: "/image/newdubai.jpg", sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" },
  { name: "Mumbai", image: "/image/mumbai.jpg", sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" },
  { name: "Cape Town", image: "/image/cape-town.jpg", sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" },
  { name: "Barcelona", image: "/image/newbarcelona.jpg", sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" },
  { name: "Prague", image: "/image/newprague.jpg", sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" },
  { name: "Vienna", image: "/image/vienna.jpg", sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" },
  { name: "Amsterdam", image: "/image/newamsterdam.jpg", sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" },
  { name: "Lisbon", image: "/image/newlisbon.jpg" },
];

export function TopCities() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // ==================== HELPER FUNCTIONS ====================
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };
  // ==================== END HELPER FUNCTIONS ====================

  useEffect(() => {
    checkScroll();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth / 2;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-16 bg-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Top Cities</h2>
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex overflow-x-auto space-x-6 no-scrollbar scroll-smooth"
            onScroll={checkScroll}
          >
            {cities.map((city) => (
              <div key={city.name} className="flex-none w-64">
                <div className="relative aspect-[3/4] group overflow-hidden rounded-lg shadow-md transition-all duration-300 hover:shadow-xl">
                  <Image
                    src={city.image}
                    alt={city.name}
                    fill
                    sizes={city.sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
                    className="object-cover transition-all duration-300 brightness-90 group-hover:brightness-100"
                  />
                  {/* Full-width gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                  {/* Full-width blurry text background */}
                  <div className="absolute inset-x-0 bottom-0 bg-black/20 backdrop-blur-sm p-3">
                    <h3 className="text-white font-semibold text-lg">{city.name}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Left Scroll Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 shadow-lg transition-opacity ${
              canScrollLeft ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-6 w-6 text-gray-600" />
          </Button>

          {/* Right Scroll Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 shadow-lg transition-opacity ${
              canScrollRight ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-6 w-6 text-gray-600" />
          </Button>
        </div>
      </div>
    </section>
  );
}
