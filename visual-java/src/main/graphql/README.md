# How to use this folder

- the schema `./visual/schema.grapqhls` is copied from `backend/src/generated/schema.sql` and appended with the
  following:

```
schema {
  mutation: Mutation
  query: Query
}
```

- the query files in `./visual/*.graphql` are maintained in `clients/js/visual/src/documents`, they need to be copied
  manually into this client
- run `mvn clean package -DskipTests=true` to generate the new classes
- generated classes aren't unfortunately committed so will be regenerated on each build. They can be found
  in `./target/generated-sources/apollo/visual`
