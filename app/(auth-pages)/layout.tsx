
export default async function UserPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-2 min-h-screen w-full flex justify-center items-center bg-primary/10">
        {children}
    </div> 
  )
}