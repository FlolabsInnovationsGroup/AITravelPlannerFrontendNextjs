import Image from "next/legacy/image";

const places = [
  { name: "Eiffel Tower", image: "/image/neweiffeltower.jpg" },
  { name: "Great Wall", image: "/image/newgreatwall.jpg" },
  { name: "Taj Mahal", image: "/image/newtajmahal.jpg" },
  { name: "Machu Picchu", image: "/image/newmachupicchu.jpg" },
];

export function FeaturedTourPlaces() {
  return (
    <section className="py-16 bg-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Experiences</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {places.map((place) => (
            <div 
              key={place.name} 
              className="relative aspect-square rounded-lg overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <Image
                src={place.image}
                alt={place.name}
                layout="fill"
                objectFit="cover"
                className="rounded-lg transition-all duration-300 brightness-90 hover:brightness-100"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 backdrop-blur-sm">
                <h3 className="text-white font-semibold text-lg">{place.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
