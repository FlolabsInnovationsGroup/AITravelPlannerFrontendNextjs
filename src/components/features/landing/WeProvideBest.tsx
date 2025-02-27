import { Card, CardContent } from "@/components/ui/card"

const features = [
  { icon: "🌍", title: "Custom Travel Plans" },
  { icon: "✈️", title: "Flight Booking" },
  { icon: "🏨", title: "Hotel Reservations" }
]

export function WeProvideBest() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
       
        <p className="text-center mb-12 max-w-2xl mx-auto">
        The best AI travel system is here to assist you in everything when it comes to planning your trips.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardContent className="flex flex-col items-center p-6">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}