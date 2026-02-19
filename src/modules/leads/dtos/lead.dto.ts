import { IsString, IsEmail, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';

export class CreateLeadDto {
    @ApiProperty({
        example: 'John Doe',
        description: 'Full name of the lead',
    })
    @IsString()
    name: string;

    @ApiProperty({
        example: 'john@example.com',
        description: 'Email address of the lead',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: '+1-555-123-4567',
        description: 'Phone number of the lead (optional)',
        required: false,
    })
    @IsOptional()
    @IsString()
    phone?: string;
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

    @ApiProperty({
        example: '+1-555-123-4567',
        description: 'Phone number of the lead',
        required: false,
    })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({
        enum: Object.values(Status),
        description: 'Status of the lead',
        required: false,
    })
    @IsOptional()
    @IsEnum(Status)
    status?: Status;

    @ApiProperty({
        example: 'Budget no longer available',
        description: 'Reason for losing the lead (required if status is LOST)',
        required: false,
    })
    @IsOptional()
    @IsString()
    lostReason?: string;

    @ApiProperty({
        example: '2024-02-21T10:00:00Z',
        description: 'Next follow-up date and time',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    nextFollowUpAt?: string;
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
        enum: Object.values(Status),
        description: 'Filter by status',
        required: false,
    })
    @IsOptional()
    @IsEnum(Status)
    status?: Status;

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
        description: 'Filter overdue followups (status in [CONTACTED, PROPOSAL, ON_HOLD] and nextFollowUpAt < now)',
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
