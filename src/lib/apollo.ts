import { ApolloClient, InMemoryCache, createHttpLink, from, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import nhost from './nhost';

// Create an HTTP link
const httpLink = createHttpLink({
  uri: `https://xakuxhqdhfmxusxlsfku.hasura.us-east-1.nhost.run/v1/graphql`,
});

// Create a WebSocket link for subscriptions
const wsLink = typeof window !== 'undefined' ? new GraphQLWsLink(createClient({
  url: 'wss://xakuxhqdhfmxusxlsfku.hasura.us-east-1.nhost.run/v1/graphql',
  connectionParams: () => {
    const token = nhost.auth.getAccessToken();
    return {
      headers: {
        ...(token && { authorization: `Bearer ${token}` }),
      }
    };
  },
})) : null;

// Create an auth link
const authLink = setContext((_, { headers }) => {
  const token = nhost.auth.getAccessToken();
  return {
    headers: {
      ...headers,
      ...(token && { authorization: `Bearer ${token}` }),
    }
  }
});

// Create an error link to handle GraphQL errors gracefully
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.warn(
        `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }

  if (networkError) {
    console.warn(`Network error: ${networkError}`);
  }
});

// Create Apollo Client with error handling
export const apolloClient = new ApolloClient({
  link: from([
    errorLink, 
    authLink, 
    // Split link to use WebSocket for subscriptions and HTTP for queries/mutations
    typeof window !== 'undefined' && wsLink
      ? split(
          ({ query }) => {
            const definition = getMainDefinition(query);
            return (
              definition.kind === 'OperationDefinition' &&
              definition.operation === 'subscription'
            );
          },
          wsLink,
          httpLink
        )
      : httpLink
  ]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          boards: {
            merge: false, // Don't merge arrays, replace them
          },
          boards_by_pk: {
            merge: false,
          }
        }
      }
    }
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    }
  }
});
