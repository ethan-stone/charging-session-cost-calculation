import { StackContext, Function } from "sst/constructs";

export function MyStack({ stack }: StackContext) {
  new Function(stack, "MyFunction", {
    handler: "packages/functions/src/lambda.handler",
  });
}
