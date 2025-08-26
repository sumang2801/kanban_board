
"use client";
import { ApolloClient, InMemoryCache, ApolloProvider, useQuery } from '@apollo/client';
import { GetCountriesDocument } from '@/graphql/generated-types';

const client = new ApolloClient({
  uri: 'https://countries.trevorblades.com/',
  cache: new InMemoryCache(),
});

function CountriesList() {
  const { data, loading, error } = useQuery(GetCountriesDocument);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></span>
      <span className="ml-4 text-lg text-gray-500">Loading countries...</span>
    </div>
  );
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-5xl mt-8">
      {data.countries.map((country: { code: string; name: string }) => (
        <div
          key={country.code}
          className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 flex flex-col items-center hover:scale-105 transition-transform border border-gray-200 dark:border-zinc-800"
        >
          <div className="text-2xl font-semibold mb-2 text-blue-600 dark:text-blue-400">{country.name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Code: <span className="font-mono">{country.code}</span></div>
        </div>
      ))}
    </div>
  );
}

export default function CountriesPage() {
  return (
    <ApolloProvider client={client}>
      <main className="flex min-h-screen flex-col items-center justify-start p-8 bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
        <h1 className="text-5xl font-extrabold mb-6 text-blue-700 dark:text-blue-400 drop-shadow-lg">🌍 Countries</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl text-center">
          Explore countries from around the world. Powered by GraphQL, Apollo Client, and Next.js.
        </p>
        <CountriesList />
      </main>
    </ApolloProvider>
  );
}
