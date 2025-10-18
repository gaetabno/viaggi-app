import { redirect } from "next/navigation";
import { createClient } from '@/app/utils/supabase/server'
import Header from "./_components/Header";


export default async function Home() {

      const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser()

    if (error || !data?.user) {
      redirect('/login')
    }
  return (
    <div className="p-2 w-full">
      <Header />
      <div className="mt-4 text-center">
        <h1 className="text-2xl font-bold">Benvenuto in Viaggi App!</h1>
        <p className="mt-2">Usa il menu in alto per navigare tra le sezioni.</p>
      </div>
    
    </div>
  );
}
