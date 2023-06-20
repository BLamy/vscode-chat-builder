const { z } = require('zod');
const { ChatCompletionRequestMessageRoleEnum } = require('openai');

const messageSchema = z.object({
	role: z.nativeEnum(ChatCompletionRequestMessageRoleEnum),
	content: z.string(),
	name: z.string().optional(),
});

const message = messageSchema.parse({
	role: "user",
	content: 'Hello, world!',
	name: 'John Doe',
});