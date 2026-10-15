export interface SupabaseClientStub {
  from: (table: string) => any;
  storage: { from: (bucket: string) => any };
  auth: { admin: any };
}

export function createClient(url: string, key: string, _options?: any): SupabaseClientStub {
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };

  return {
    from: (table: string) => ({
      select: (_cols?: string, _opts?: any) => ({
        eq: (_field: string, _val: any) => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
        ilike: (_field: string, _val: any) => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
        order: (_field: string, _opts?: any) => Promise.resolve({ data: [], error: null }),
      }),
      delete: () => ({
        eq: async (_field: string, _val: any) => ({ data: [], error: null }),
        ilike: async (_field: string, _val: any) => ({ data: [], error: null }),
      }),
      update: (_data: any) => ({
        eq: async (_field: string, _val: any) => ({ data: null, error: null }),
      }),
      insert: async (_rows: any[]) => ({ data: null, error: null }),
    }),
    storage: {
      from: (_bucket: string) => ({
        list: async () => ({ data: [], error: null }),
        remove: async () => ({ data: [], error: null }),
      }),
    },
    auth: {
      admin: {
        listUsers: async () => ({ data: { users: [] }, error: null }),
        deleteUser: async () => ({ data: null, error: null }),
      },
    },
  };
}

export type User = any;
