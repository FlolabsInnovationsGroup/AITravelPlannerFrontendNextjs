import { Bed, CalendarCheck, Plane } from "lucide-react"

const features = [
  { icon: Bed, title: "Accommodations" },
  { icon: CalendarCheck, title: "Reservations" },
  { icon: Plane, title: "Flights" },
]

export function WeProvideBest() {
  return (
    <section className="py-20 bg-white border-t border-stone-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <p className="text-center text-stone-600 text-lg max-w-2xl mx-auto mb-14">
          The best AI travel system is here to assist you with everything when it comes to planning your trips.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
          {features.map(({ icon: Icon, title }) => (
            <div
              key={title}
              className="group flex flex-col items-center text-center p-8 rounded-2xl bg-stone-50 border border-stone-200/80 hover:border-amber-200 hover:bg-amber-50/50 transition-all duration-300"
            >
              <div className="mb-4 p-4 rounded-xl bg-white border border-stone-200/80 shadow-sm group-hover:border-amber-200 group-hover:text-amber-600 transition-colors">
                <Icon className="w-8 h-8 text-stone-700 group-hover:text-amber-600 mx-auto" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-stone-800">{title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
