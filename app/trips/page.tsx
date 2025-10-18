import { Trip } from "@/_types/Trips"
import TripCard from "../_components/TripCard"
import {createClient} from 'pexels'; 

const tripsArr: Trip[] = [
    {
        "id": 1,
        "name": "Weekend a Parigi",
        "expect": "Visitare musei e mangiare croissant",
        "date_start": "12.09.25",
        "date_end": "15.09.25",
        "lat": 48.8566,
        "long": 2.3522,
        "image": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34",
        "country":"Francia"
    },
    {
        "id": 2,
        "name": "Tour in Baviera",
        "expect": "Castelli, birra e paesaggi alpini",
        "date_start": "20.10.25",
        "date_end": "27.10.25",
        "lat": 48.7904,
        "long": 11.4979,
        "image": "https://images.unsplash.com/photo-1563555247508-9c3a7f62b5f5",
        "country":"Germania"
    },
    {
        "id": 3,
        "name": "Capodanno a Vienna",
        "expect": "Concerti e mercatini",
        "date_start": "29.12.25",
        "date_end": "02.01.26",
        "lat": 48.2082,
        "long": 16.3738,
        "image": "https://images.unsplash.com/photo-1561312173-f38fefcf8c4a",
        "country":"Austria"
    },
    {
        "id": 4,
        "name": "Trekking in Slovenia",
        "expect": "Laghetti alpini e natura",
        "date_start": "05.06.26",
        "date_end": "10.06.26",
        "lat": 46.1512,
        "long": 14.9955,
        "image": "https://images.unsplash.com/photo-1598454446373-5a6626562fdc",
        "country":"Slovenia"
    },
    {
        "id": 5,
        "name": "Viaggio in Portogallo",
        "expect": "Città colorate e oceano",
        "date_start": "15.08.26",
        "date_end": "25.08.26",
        "lat": 38.7169,
        "long": -9.1399,
        "image": "https://images.unsplash.com/photo-1505765050516-f72dcac9c60b",
        "country":"Portogallo"
    }
]

 interface PhotoTrip extends Trip {
    color?: string,
    src?: string
}


export default async function TrpsPage() {

     const client = createClient(process.env.NEXT_PUBLIC_PEXEL_API_KEY!);
 
     
    const TripsWithPhoto = await Promise.all(
        tripsArr.map(async (trip:PhotoTrip) => {
            const p = await client.photos.search({
            query: `${trip.name} ${trip.expect}`,
            per_page: 1,
            });

            const photo = p.photos[0];
            return {
            ...trip,
            src: photo?.src?.landscape ?? "",
            color: photo?.avg_color ?? "#000000",
            };
        })
    );
 
 
    return (
    <div className="p-2 grid gap-3 lg:grid-cols-3">
        { TripsWithPhoto.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
        ))}
    </div> 

    )
}
