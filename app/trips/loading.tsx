import SkeletonCard from "../_components/SkeletonCard";

 
 
export default function TrpsPage() {
    return (
    <div className="p-2 grid gap-3 lg:grid-cols-3">
        { Array.from({ length: 4 }).map((_, index) => ( 
            <SkeletonCard key={index} />
        )) }
    </div> 

    )
}
