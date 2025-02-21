import Image from "next/legacy/image"

const places = [
  { name: "Eiffel Tower", image: "/effiel-towel.jpg" },
  { name: "Great Wall", image: "/image/great-wall.jpg" },
  { name: "Taj Mahal", image: "/image/TajMahal.jpg" },
  { name: "Machu Picchu", image: "/image/machu-picchu.jpg" },
]

export function FeaturedTourPlaces() {
  return (
    <section className="py-16 bg-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">Featured Tour Places</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {places.map((place, index) => (
            <div key={index} className="relative aspect-square">
              <Image
                src={place.image}
                alt={place.name}
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <h3 className="text-white font-semibold">{place.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}