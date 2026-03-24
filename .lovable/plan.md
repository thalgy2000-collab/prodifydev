

## Problema

A query na tabela `products` retorna erro **"infinite recursion detected in policy"**. Isso acontece porque:

1. A política `select_products` consulta `product_members` para verificar acesso
2. As políticas de `product_members` (`select_memberships`, `delete_memberships`) consultam `products` para verificar `owner_id`
3. Isso cria um loop infinito de RLS

## Solução

Criar uma migração SQL que:

1. **Remove as políticas recursivas** de `product_members` (`select_memberships`, `delete_memberships`)
2. **Remove a política recursiva** de `products` (`select_products`)
3. **Recria `select_products`** usando a função `is_product_member` (SECURITY DEFINER, que bypassa RLS) em vez de subquery direta:
   ```sql
   USING (owner_id = auth.uid() OR is_product_member(auth.uid(), id))
   ```
4. **Não precisa recriar** as políticas removidas de `product_members`, pois já existem políticas funcionais (`Members can view product members`, `Owner can delete members`) que usam as funções SECURITY DEFINER

Nenhuma alteração de código no frontend é necessária.

