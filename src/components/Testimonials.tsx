import Image from "next/legacy/image"

const testimonials = [
  {
    name: "John Doe",
    image: "/image/john-doe.png",
    text: "Amazing experience! The tour was well-organized and our guide was knowledgeable and friendly.",
    rating: 5,
  },
  {
    name: "Jane Smith",
    image: "/image/jane-smith.png",
    text: "I had a wonderful time on this tour. The sights were breathtaking and the itinerary was perfect.",
    rating: 5,
  },
  {
    name: "Mike Johnson",
    image: "/image/mike-johnson.png",
    text: "Exceeded my expectations! I'll definitely be booking another tour with this company.",
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section className="py-16 bg-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">What Our Clients Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <Image
                  src={testimonial.image}
                  alt={testimonial.name}
                  width={60}
                  height={60}
                  style={{ width: 'auto', height: 'auto' }}
                  className="rounded-full mr-4"
                />
                <div>
                  <h3 className="font-semibold">{testimonial.name}</h3>
                  <div className="flex text-yellow-400">
                    {Array.from({ length: testimonial.rating }, (_, k) => k + 1).map((starNum) => (
                      <svg key={`${testimonial.name}-star-${starNum}`} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600">{testimonial.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}