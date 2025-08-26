import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: [
    {
      'https://xakuxhqdhfmxusxlsfku.hasura.us-east-1.nhost.run/v1/graphql': {
        headers: {
          'x-hasura-admin-secret': "n,bVPl*Za'QvA6z!bd$38LXL;EsDjxw3"
        }
      }
    }
  ],
  documents: 'src/graphql/**/*.graphql',
  generates: {
    'src/graphql/generated-types.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo'
      ]
    }
  }
};

export default config;
