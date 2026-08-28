import { z } from 'zod';

const issueTypeEnum = z.enum(['missing_price', 'ambiguous_pricing', 'unavailable_option', 'precision_anomaly', 'pdf_mismatch', 'duplicate_name']);
const issueSeverityEnum = z.enum(['info', 'warning', 'critical']);
const issueStatusEnum = z.enum(['open', 'resolved', 'waived']);

export const dataQualityQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: issueStatusEnum.optional(),
  severity: issueSeverityEnum.optional(),
  issue_type: issueTypeEnum.optional(),
  service_id: z.coerce.number().int().optional(),
});

export const resolveIssueSchema = z.object({
  status: issueStatusEnum,
  resolved_by: z.number().int().optional(),
  note: z.string().optional(),
});

export const summaryQuerySchema = z.object({});
