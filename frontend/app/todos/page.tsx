import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <div className="min-h-screen bg-dark-bg text-white p-8 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-extrabold mb-6 tracking-tight bg-gradient-to-r from-primary-glow to-primary-blue bg-clip-text text-transparent">
        Supabase Todos Test
      </h1>
      {todos && todos.length > 0 ? (
        <ul className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-lg">
          {todos.map((todo: any) => (
            <li key={todo.id} className="border-b border-white/5 pb-2 last:border-b-0 last:pb-0 flex items-center justify-between">
              <span>{todo.name}</span>
              <span className="text-xs text-silver-muted font-mono">ID: {todo.id}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center text-silver-muted max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg">
          <p className="mb-2 font-semibold">No todos found or "todos" table is not created yet.</p>
          <p className="text-xs">
            Make sure to create a <code className="bg-black/30 px-1 py-0.5 rounded text-primary-glow">todos</code> table in your Supabase database with columns <code className="bg-black/30 px-1 py-0.5 rounded text-primary-glow">id</code> and <code className="bg-black/30 px-1 py-0.5 rounded text-primary-glow">name</code>.
          </p>
        </div>
      )}
    </div>
  )
}
