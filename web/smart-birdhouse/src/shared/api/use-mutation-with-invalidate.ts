import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';

type QueryKeyLike = QueryKey | readonly unknown[];

export function useMutationWithInvalidate<TData, TError, TVariables>(
  options: {
    mutationFn: (variables: TVariables) => Promise<TData>;
    invalidateKeys: QueryKeyLike[];
  } & Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>,
) {
  const client = useQueryClient();
  const { mutationFn, invalidateKeys, onSuccess, ...rest } = options;

  return useMutation({
    ...rest,
    mutationFn,
    onSuccess: (data, variables, context, mutationMeta) => {
      invalidateKeys.forEach((key) => {
        client.invalidateQueries({ queryKey: key });
      });
      onSuccess?.(data, variables, context, mutationMeta as never);
    },
  });
}
