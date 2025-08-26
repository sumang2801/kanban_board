import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import nhost from './nhost';

// Create an HTTP link
const httpLink = createHttpLink({
  uri: `https://xakuxhqdhfmxusxlsfku.hasura.us-east-1.nhost.run/v1/graphql`,
});

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
  link: from([errorLink, authLink, httpLink]),
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
