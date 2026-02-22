import { IsString, IsEmail, IsOptional, IsEnum, IsDateString, IsDecimal } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateLeadDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the lead',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Email address of the lead (optional)',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: '+1-555-123-4567',
    description: 'Phone number of the lead (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'Tech Company Inc.',
    description: 'Company name',
  })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({
    example: 'Facebook',
    description: 'Source of the lead',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    example: 5000.5,
    description: 'Expected deal value',
  })
  @IsOptional()
  value?: number;

  @ApiPropertyOptional({
    example: 'Initial contact made',
    description: 'Notes about the lead',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLeadDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the lead',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'john@example.com',
    description: 'Email address',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: '+1-555-123-4567',
    description: 'Phone number of the lead',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'Tech Company Inc.',
    description: 'Company name',
  })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({
    example: 'LinkedIn',
    description: 'Source of the lead',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    example: 5000.5,
    description: 'Expected deal value',
  })
  @IsOptional()
  value?: number;

  @ApiProperty({
    enum: Object.values(LeadStatus),
    description: 'Status of the lead',
    required: false,
  })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({
    example: 'Budget no longer available',
    description: 'Reason for losing the lead (required if status is LOST)',
  })
  @IsOptional()
  @IsString()
  lostReason?: string;

  @ApiPropertyOptional({
    example: '2024-02-21T10:00:00Z',
    description: 'Next follow-up date and time',
  })
  @IsOptional()
  @IsDateString()
  nextFollowUpAt?: string;

  @ApiPropertyOptional({
    example: 'Initial contact made',
    description: 'Notes about the lead',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class LeadResponseDto {
  @ApiProperty({
    example: 'cuid-12345',
    description: 'The lead unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    example: 'john@example.com',
    nullable: true,
  })
  email: string | null;

  @ApiProperty({
    example: '+1-555-123-4567',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    example: 'Tech Company Inc.',
    nullable: true,
  })
  company: string | null;

  @ApiProperty({
    enum: LeadStatus,
    example: 'NEW',
  })
  status: LeadStatus;

  @ApiProperty({
    example: 'Facebook',
    nullable: true,
  })
  source: string | null;

  @ApiProperty({
    example: 5000.5,
    type: 'number',
    nullable: true,
  })
  value: number | null;

  @ApiProperty({
    example: '2024-02-21T10:00:00Z',
    nullable: true,
  })
  nextFollowUpAt: Date | null;

  @ApiProperty({
    example: 'Initial contact made',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    example: 'Budget constraints',
    nullable: true,
  })
  lostReason: string | null;

  @ApiProperty({
    example: '2024-02-21T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-02-21T10:00:00Z',
  })
  updatedAt: Date;
}

export class ListLeadsResponseDto {
  @ApiProperty({
    type: [LeadResponseDto],
    description: 'Array of leads',
  })
  data: LeadResponseDto[];

  @ApiProperty({
    example: 100,
    description: 'Total number of leads',
  })
  total: number;

  @ApiProperty({
    example: 1,
    description: 'Current page number',
  })
  page: number;

  @ApiProperty({
    example: 10,
    description: 'Number of items per page',
  })
  limit: number;

  @ApiProperty({
    example: 10,
    description: 'Total number of pages',
  })
  totalPages: number;
}

export class ListLeadsQueryDto {
  @ApiProperty({
    example: '1',
    description: 'Page number (1-indexed)',
    required: false,
  })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiProperty({
    example: '10',
    description: 'Number of items per page',
    required: false,
  })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiProperty({
    enum: Object.values(LeadStatus),
    description: 'Filter by status',
    required: false,
  })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiProperty({
    example: 'John',
    description: 'Search by name or email',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    example: 'true',
    description:
      'Filter overdue followups (status in [CONTACTED, PROPOSAL, ON_HOLD] and nextFollowUpAt < now)',
    required: false,
  })
  @IsOptional()
  @IsString()
  isOverdue?: string;

  @ApiProperty({
    example: 'createdAt',
    description: 'Sort field',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({
    example: 'desc',
    description: 'Sort direction (asc or desc)',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortOrder?: string;
}
