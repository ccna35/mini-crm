import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Patch,
    Delete,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiOkResponse,
    ApiBadRequestResponse,
    ApiNotFoundResponse,
    ApiCreatedResponse,
} from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto, ListLeadsQueryDto } from './dtos/lead.dto';
import { Lead } from '@prisma/client';

@ApiTags('Leads')
@Controller('leads')
export class LeadsController {
    constructor(private readonly leadsService: LeadsService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new lead' })
    @ApiCreatedResponse({
        description: 'Lead created successfully',
        type: Lead,
    })
    @ApiBadRequestResponse({
        description: 'Invalid input data',
    })
    async create(@Body() createLeadDto: CreateLeadDto): Promise<Lead> {
        return this.leadsService.create(createLeadDto);
    }

    @Get()
    @ApiOperation({
        summary: 'List all leads with pagination and filtering',
    })
    @ApiOkResponse({
        description: 'List of leads',
        schema: {
            example: {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            },
        },
    })
    async findAll(@Query() query: ListLeadsQueryDto) {
        return this.leadsService.findAll(query);
    }

    @Get('overdue')
    @ApiOperation({
        summary: 'Get overdue followups',
        description:
            'Leads with nextFollowUpAt < now and status in [CONTACTED, PROPOSAL, ON_HOLD]',
    })
    @ApiOkResponse({
        description: 'List of overdue leads',
        type: [Lead],
    })
    async getOverdueFollowups(): Promise<Lead[]> {
        return this.leadsService.getOverdueFollowups();
    }

    @Get('upcoming')
    @ApiOperation({
        summary: 'Get upcoming followups for the next 7 days',
        description: 'Leads with followups scheduled in the next 7 days',
    })
    @ApiOkResponse({
        description: 'List of leads with upcoming followups',
        type: [Lead],
    })
    async getUpcomingFollowups(): Promise<Lead[]> {
        return this.leadsService.getUpcomingFollowups(7);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a lead by ID' })
    @ApiOkResponse({
        description: 'Lead details',
        type: Lead,
    })
    @ApiNotFoundResponse({
        description: 'Lead not found',
    })
    async findOne(@Param('id') id: string): Promise<Lead> {
        return this.leadsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a lead' })
    @ApiOkResponse({
        description: 'Lead updated successfully',
        type: Lead,
    })
    @ApiBadRequestResponse({
        description: 'Invalid input data or business rule violation',
    })
    @ApiNotFoundResponse({
        description: 'Lead not found',
    })
    async update(
        @Param('id') id: string,
        @Body() updateLeadDto: UpdateLeadDto,
    ): Promise<Lead> {
        return this.leadsService.update(id, updateLeadDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete a lead' })
    @ApiOkResponse({
        description: 'Lead deleted successfully',
        type: Lead,
    })
    @ApiNotFoundResponse({
        description: 'Lead not found',
    })
    async remove(@Param('id') id: string): Promise<Lead> {
        return this.leadsService.remove(id);
    }
}
