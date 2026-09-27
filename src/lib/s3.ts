import {
	BucketLocationConstraint,
	CreateBucketCommand,
	DeleteObjectCommand,
	GetObjectCommand,
	HeadBucketCommand,
	PutObjectCommand,
	S3Client,
	type S3ClientConfig,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createServerFn, createServerOnlyFn } from '@tanstack/react-start'
import { z } from 'zod'

import { serverEnv as env } from '@/env.server'

export interface Storage {
	put(key: string, body: Uint8Array, contentType: string): Promise<void>
	delete(key: string): Promise<void>
	get(key: string): Promise<StoredImage | null>
	/** Presigned PUT URL for browser-initiated uploads. */
	uploadUrl(
		key: string,
		contentType: string,
		expiresIn: number,
	): Promise<string>
	readUrl(key: string, expiresIn: number): Promise<string>
}

export interface StoredImage {
	data: Uint8Array
	contentType: string | undefined
}

export interface StorageConfig {
	endpointUrl?: string
	region?: string
	bucketName?: string
	accessKeyId?: string
	secretAccessKey?: string
	// Production buckets are provisioned outside the app; creating one on
	// demand there would mask a misconfigured bucket name.
	autoCreateBucket?: boolean
}

export function createStorage(config: StorageConfig = {}): Storage {
	const bucketName = config.bucketName ?? env.AWS_S3_BUCKET_NAME

	if (!bucketName) {
		throw new Error('S3 storage is not configured (missing AWS_S3_BUCKET_NAME)')
	}

	const autoCreateBucket = config.autoCreateBucket ?? true
	const region = config.region ?? env.AWS_REGION ?? 'us-east-1'
	const accessKeyId = config.accessKeyId ?? env.AWS_ACCESS_KEY_ID
	const secretAccessKey = config.secretAccessKey ?? env.AWS_SECRET_ACCESS_KEY
	const endpoint = config.endpointUrl ?? env.AWS_ENDPOINT_URL

	const clientConfig: S3ClientConfig = {
		forcePathStyle: true,
		requestHandler: {
			connectionTimeout: 3_000,
			requestTimeout: 10_000,
			throwOnRequestTimeout: true,
		},
		region,
	}

	if (endpoint) {
		clientConfig.endpoint = endpoint
	}

	if (accessKeyId && secretAccessKey) {
		clientConfig.credentials = { accessKeyId, secretAccessKey }
	}

	const client = new S3Client(clientConfig)

	let bucketReady: Promise<void> | undefined

	const ensureBucket = () => {
		if (!autoCreateBucket) {
			return Promise.resolve()
		}

		bucketReady ??= createBucketIfNeeded(client, bucketName, region).catch(
			(error) => {
				bucketReady = undefined
				throw error
			},
		)

		return bucketReady
	}

	return {
		async put(key, body, contentType) {
			await ensureBucket()
			await client.send(
				new PutObjectCommand({
					Bucket: bucketName,
					Key: key,
					Body: body,
					ContentType: contentType,
				}),
			)
		},
		async delete(key) {
			await client.send(
				new DeleteObjectCommand({ Bucket: bucketName, Key: key }),
			)
		},
		async get(key) {
			try {
				const output = await client.send(
					new GetObjectCommand({ Bucket: bucketName, Key: key }),
				)

				if (!output.Body) {
					return null
				}

				return {
					data: await output.Body.transformToByteArray(),
					contentType: output.ContentType,
				}
			} catch (error) {
				if (isAwsHttpError(error, 404) || hasErrorName(error, 'NoSuchKey')) {
					return null
				}

				throw error
			}
		},
		async uploadUrl(key, contentType, expiresIn) {
			await ensureBucket()

			const command = new PutObjectCommand({
				Bucket: bucketName,
				Key: key,
				ContentType: contentType,
			})

			return getSignedUrl(client, command, { expiresIn })
		},
		async readUrl(key, expiresIn) {
			const command = new GetObjectCommand({
				Bucket: bucketName,
				Key: key,
			})

			return getSignedUrl(client, command, { expiresIn })
		},
	}
}

let sharedStorage: Storage | undefined

/** Lazily-created server-side storage for the running app. */
export const getStorage = createServerOnlyFn(() => {
	// A client per request would rebuild TLS connections on every object read.
	// Production buckets are pre-provisioned, so auto-create stays a dev
	// convenience.
	sharedStorage ??= createStorage({
		autoCreateBucket: process.env.NODE_ENV !== 'production',
	})

	return sharedStorage
})

async function createBucketIfNeeded(
	client: S3Client,
	bucketName: string,
	region: string,
): Promise<void> {
	try {
		await client.send(new HeadBucketCommand({ Bucket: bucketName }))

		return
	} catch (error) {
		if (!isAwsHttpError(error, 404)) {
			throw error
		}
	}

	try {
		// us-east-1 rejects an explicit location constraint; every other
		// region requires one.
		const locationConstraint = Object.values(BucketLocationConstraint).find(
			(value) => value === region,
		)

		await client.send(
			new CreateBucketCommand({
				Bucket: bucketName,
				...(region !== 'us-east-1' &&
					locationConstraint && {
						CreateBucketConfiguration: {
							LocationConstraint: locationConstraint,
						},
					}),
			}),
		)
	} catch (error) {
		// Production buckets are pre-provisioned and concurrent views can race
		// on first use; both surface as an "already exists" error.
		const alreadyExists =
			hasErrorName(error, 'BucketAlreadyOwnedByYou') ||
			hasErrorName(error, 'BucketAlreadyExists')

		if (!alreadyExists) {
			throw error
		}
	}
}

interface AwsHttpError {
	$metadata: { httpStatusCode: number }
}

function isAwsHttpError(error: unknown, status: number): error is AwsHttpError {
	if (!(error instanceof Object) || !('$metadata' in error)) {
		return false
	}

	const metadata: unknown = error.$metadata

	return (
		metadata instanceof Object &&
		'httpStatusCode' in metadata &&
		metadata.httpStatusCode === status
	)
}

function hasErrorName(error: unknown, name: string): error is Error {
	return error instanceof Error && error.name === name
}

/**
 * Cleanup must not turn a successful database write into a failed request.
 * Callers holding a Storage instance pass it so the deletion targets the
 * same storage that served the request.
 */
export async function deleteImageObject(
	storage: Storage,
	key: string,
): Promise<void> {
	try {
		await storage.delete(key)
	} catch (error) {
		console.warn(
			`Failed to delete unused object ${key}; retry separately`,
			error,
		)
	}
}

// ============================================================================
// * Avatar server functions
// ============================================================================

export const getAvatarUrl = createServerFn({ method: 'GET' })
	.validator(z.object({ image: z.string().nullish() }))
	.handler(async ({ data }): Promise<string | undefined> => {
		if (!data.image) return undefined

		const isPublicUrl = /^https?:\/\//.test(data.image)

		if (isPublicUrl) return data.image

		return getStorage().readUrl(data.image, 60 * 60)
	})

export const getAvatarUploadUrl = createServerFn({ method: 'POST' })
	.validator(z.object({ key: z.string().min(1).max(200) }))
	.handler(async ({ data }) => {
		return {
			url: await getStorage().uploadUrl(data.key, 'image/*', 900),
		}
	})
