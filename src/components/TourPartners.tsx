import Image from "next/legacy/image"

const partners = [
  // { name: "Amadeus", logo: "/images/amadeus-logo.png" },
  // { name: "Booking", logo: "/images/booking-logo.png" },
  // { name: "Trivago", logo: "/images/trivago-logo.png" },
  // { name: "Airbnb", logo: "/images/airbnb-logo.png" },
]

export function TourPartners() {
  return (
    <section className="py-16 bg-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Our Tour Partners</h2>
        <div className="flex justify-between items-center flex-wrap">
          {partners.map((partner, index) => (
            <div key={index} className="w-1/2 md:w-1/4 p-4">
              <Image
                src={partner.logo}
                alt={partner.name}
                width={150}
                height={50}
                objectFit="contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}