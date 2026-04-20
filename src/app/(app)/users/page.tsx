"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Trash2, Plus } from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "VIEWER";
  active: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "VIEWER" as "ADMIN" | "VIEWER" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  async function load() {
    const res = await fetch("/api/users", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setUsers(json.users);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({ error: "Erro" }));
      setError(j.error ?? "Erro ao criar usuário");
      return;
    }
    setForm({ name: "", email: "", password: "", role: "VIEWER" });
    load();
  }

  async function toggleActive(u: UserItem) {
    await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    load();
  }

  async function changeRole(u: UserItem, role: "ADMIN" | "VIEWER") {
    await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    load();
  }

  async function remove(u: UserItem) {
    if (!confirm(`Remover ${u.email}?`)) return;
    await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie quem pode acessar o painel.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Novo usuário</CardTitle>
            <CardDescription>Crie contas de acesso.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <Label>Nome</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Senha inicial</Label>
                <Input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div>
                <Label>Perfil</Label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as "ADMIN" | "VIEWER" })
                  }
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="VIEWER">Visualizador</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                {loading ? "Criando..." : "Criar usuário"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cadastrados ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3">Nome</th>
                    <th className="py-2 pr-3">E-mail</th>
                    <th className="py-2 pr-3">Perfil</th>
                    <th className="py-2 pr-3">Ativo</th>
                    <th className="py-2 pr-3">Criado</th>
                    <th className="py-2 pr-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b">
                      <td className="py-2 pr-3">{u.name}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{u.email}</td>
                      <td className="py-2 pr-3">
                        <select
                          value={u.role}
                          onChange={(e) =>
                            changeRole(u, e.target.value as "ADMIN" | "VIEWER")
                          }
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="VIEWER">Visualizador</option>
                          <option value="ADMIN">Administrador</option>
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <button
                          onClick={() => toggleActive(u)}
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.active
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {u.active ? "Sim" : "Não"}
                        </button>
                      </td>
                      <td className="py-2 pr-3">{formatDate(u.createdAt)}</td>
                      <td className="py-2 pr-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(u)}
                          disabled={u.id === session?.user?.id}
                          title={u.id === session?.user?.id ? "Não é possível remover você mesmo" : "Remover"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
