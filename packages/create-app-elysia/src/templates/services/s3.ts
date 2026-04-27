import { dedent } from "ts-dedent";
import type { Preferences } from "../../utils";

/**
 * 生成 S3 存储服务文件 (src/services/s3.ts)
 * 支持 Bun.S3Client 和 AWS SDK 两种客户端
 */
export function getS3ServiceFile({ s3Client }: Preferences) {
	// Bun 原生 S3 客户端
	if (s3Client === "Bun.S3Client") {
		return dedent /* ts */`
import { S3Client } from "bun";
import { config } from "../config.ts";

export const s3 = new S3Client({
    endpoint: config.S3_ENDPOINT,
    accessKeyId: config.S3_ACCESS_KEY_ID,
    secretAccessKey: config.S3_SECRET_ACCESS_KEY,
});
`;
	}

	// AWS SDK S3 客户端
	if (s3Client === "@aws-sdk/client-s3") {
		return dedent /* ts */`
import { S3Client } from "@aws-sdk/client-s3";
import { config } from "../config.ts";

export const s3 = new S3Client({
    endpoint: config.S3_ENDPOINT,
    region: "minio",
    credentials: {
        accessKeyId: config.S3_ACCESS_KEY_ID,
        secretAccessKey: config.S3_SECRET_ACCESS_KEY,
    },
});
`;
	}

	return "";
}
