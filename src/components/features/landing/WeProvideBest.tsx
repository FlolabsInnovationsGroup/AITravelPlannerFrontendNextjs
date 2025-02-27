import { Bed, CalendarCheck, Plane } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  { icon: <Bed size={50} className="text-blue-600" />, title: "Accommodations" },
  { icon: <CalendarCheck size={50} className="text-blue-600" />, title: "Reservations" },
  { icon: <Plane size={50} className="text-blue-600" />, title: "Flights" },
];

export function WeProvideBest() {
  return (
    <section className="py-16 bg-gray-100">
      <div className="container mx-auto px-4">
        <p className="text-center text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          The best AI travel system is here to assist you in everything when it comes to planning your trips.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 border border-gray-200 rounded-lg shadow-md bg-white hover:shadow-lg transition-shadow duration-300"
            >
              <CardContent className="flex flex-col items-center p-6">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800">{feature.title}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
