import Image from "next/image"

const places = [
  { name: "Eiffel Tower", image: "/image/neweiffeltower.jpg" },
  { name: "Great Wall", image: "/image/newgreatwall.jpg" },
  { name: "Taj Mahal", image: "/image/newtajmahal.jpg" },
  { name: "Machu Picchu", image: "/image/newmachupicchu.jpg" },
]

export function FeaturedTourPlaces() {
  return (
    <section className="py-20 bg-stone-50 border-t border-stone-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight mb-10">
          Experiences
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {places.map((place) => (
            <div
              key={place.name}
              className="group relative aspect-square rounded-xl overflow-hidden border border-stone-200/80 shadow-sm hover:shadow-md hover:border-amber-200/80 transition-all duration-300"
            >
              <Image
                src={place.image}
                alt={place.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-semibold text-base drop-shadow-sm">{place.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
