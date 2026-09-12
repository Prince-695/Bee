# Repository Rules & Constraints

## Environment Configuration Protocol

1. **Strict Prohibition on `.env` Modification**:
   - NEVER create, edit, modify, overwrite, or delete `.env`, `.env.local`, or any live environment configuration file.
   - Do NOT use code editing or write tools (`replace_file_content`, `multi_replace_file_content`, `write_to_file`, or bash commands/redirection) on `.env`.

2. **Handling Environment Variable Additions/Changes**:
   - **Document in `.env.example`**: Whenever a new environment variable is introduced, updated, or deprecated, update [.env.example](file:///home/princerathod695/Projects/bee/.env.example) with the variable name, description, and a safe placeholder value.
   - **Instruct in Chat**: Inform the user directly in the chat conversation with the exact key and value format to add or modify in their `.env` file manually.
