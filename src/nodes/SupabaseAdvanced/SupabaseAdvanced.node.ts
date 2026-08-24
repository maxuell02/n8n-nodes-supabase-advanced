import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

type Op =
	| 'select'
	| 'insert'
	| 'upsert'
	| 'update'
	| 'delete'
	| 'count'
	| 'rpc';

type FilterOperator =
	| 'eq'
	| 'neq'
	| 'gt'
	| 'gte'
	| 'lt'
	| 'lte'
	| 'like'
	| 'ilike'
	| 'is'
	| 'in'
	| 'not';

type Filter = {
	field: string;
	operator: FilterOperator;
	value: string;
};

const removeTrailingSlashes = (value: string): string =>
	value.replace(/\/+$/, '');

const parseJson = (value: string, label: string): unknown => {
	try {
		return JSON.parse(value);
	} catch {
		throw new Error(`${label} contém JSON inválido.`);
	}
};

export class SupabaseAdvanced implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Supabase Ultra',
		name: 'supabaseUltra',
		icon: 'file:supabase.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description:
			'Advanced Supabase/PostgREST operations for n8n.',
		defaults: {
			name: 'Supabase Ultra',
		},
		inputs: ['main'],
		outputs: ['main'],

		credentials: [
			{
				name: 'supabaseAdvancedApi',
				required: true,
			},
		],

		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Select',
						value: 'select',
					},
					{
						name: 'Insert',
						value: 'insert',
					},
					{
						name: 'Upsert',
						value: 'upsert',
					},
					{
						name: 'Update',
						value: 'update',
					},
					{
						name: 'Delete',
						value: 'delete',
					},
					{
						name: 'Count',
						value: 'count',
					},
					{
						name: 'RPC',
						value: 'rpc',
					},
				],
				default: 'select',
			},

			{
				displayName: 'Table',
				name: 'table',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: [
							'select',
							'insert',
							'upsert',
							'update',
							'delete',
							'count',
						],
					},
				},
			},

			{
				displayName: 'Columns',
				name: 'columns',
				type: 'string',
				default: '*',
				placeholder: 'id,nome,valor',
				displayOptions: {
					show: {
						operation: ['select'],
					},
				},
			},

			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['select'],
					},
				},
			},

			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 100,
				description:
					'Número máximo de registros por página.',
				displayOptions: {
					show: {
						operation: ['select'],
					},
				},
			},

			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				description:
					'Registro inicial da consulta.',
				displayOptions: {
					show: {
						operation: ['select'],
					},
				},
			},

			{
				displayName: 'Order By',
				name: 'orderBy',
				type: 'string',
				default: '',
				placeholder: 'created_at.desc',
				description:
					'Exemplo: created_at.desc ou nome.asc',
				displayOptions: {
					show: {
						operation: ['select'],
					},
				},
			},

			{
				displayName: 'Filters',
				name: 'filters',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				displayOptions: {
					show: {
						operation: [
							'select',
							'update',
							'delete',
							'count',
						],
					},
				},
				options: [
					{
						displayName: 'Filter',
						name: 'filter',
						values: [
							{
								displayName: 'Field',
								name: 'field',
								type: 'string',
								default: '',
								required: true,
								placeholder: 'codigo',
							},

							{
								displayName: 'Operator',
								name: 'operator',
								type: 'options',
								options: [
									{
										name: 'Equal',
										value: 'eq',
									},
									{
										name: 'Not Equal',
										value: 'neq',
									},
									{
										name: 'Greater Than',
										value: 'gt',
									},
									{
										name: 'Greater Than or Equal',
										value: 'gte',
									},
									{
										name: 'Less Than',
										value: 'lt',
									},
									{
										name: 'Less Than or Equal',
										value: 'lte',
									},
									{
										name: 'Like',
										value: 'like',
									},
									{
										name: 'ILike',
										value: 'ilike',
									},
									{
										name: 'Is',
										value: 'is',
									},
									{
										name: 'In',
										value: 'in',
									},
									{
										name: 'Not',
										value: 'not',
									},
								],
								default: 'eq',
							},

							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								placeholder: '1001',
							},
						],
					},
				],
			},

			{
				displayName: 'Data Source',
				name: 'dataSource',
				type: 'options',
				options: [
					{
						name: 'JSON',
						value: 'json',
					},
					{
						name: 'Input Items',
						value: 'inputItems',
					},
				],
				default: 'json',
				displayOptions: {
					show: {
						operation: [
							'insert',
							'upsert',
							'update',
						],
					},
				},
			},

			{
				displayName: 'JSON Data',
				name: 'jsonData',
				type: 'json',
				default:
					'{\n  "codigo": 1001,\n  "nome": "Produto Teste"\n}',
				displayOptions: {
					show: {
						operation: [
							'insert',
							'upsert',
							'update',
						],
						dataSource: ['json'],
					},
				},
			},

			{
				displayName: 'Conflict Columns',
				name: 'onConflict',
				type: 'string',
				default: '',
				placeholder: 'filial,numero,serie',
				description:
					'Colunas utilizadas pelo Supabase para determinar conflito no Upsert.',
				displayOptions: {
					show: {
						operation: ['upsert'],
					},
				},
			},

			{
				displayName: 'Ignore Duplicates',
				name: 'ignoreDuplicates',
				type: 'boolean',
				default: false,
				description:
					'Quando ativado, registros conflitantes serão ignorados.',
				displayOptions: {
					show: {
						operation: ['upsert'],
					},
				},
			},

			{
				displayName: 'Return Data',
				name: 'returnData',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						operation: [
							'insert',
							'upsert',
							'update',
							'delete',
						],
					},
				},
			},

			{
				displayName: 'Function Name',
				name: 'functionName',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'minha_funcao',
				displayOptions: {
					show: {
						operation: ['rpc'],
					},
				},
			},

			{
				displayName: 'Arguments',
				name: 'rpcArguments',
				type: 'json',
				default: '{}',
				displayOptions: {
					show: {
						operation: ['rpc'],
					},
				},
			},
		],
	};

	async execute(
		this: IExecuteFunctions,
	): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const operation = this.getNodeParameter(
			'operation',
			0,
		) as Op;

		const credentials =
			await this.getCredentials('supabaseAdvancedApi');

		const supabaseUrl = removeTrailingSlashes(
			String(credentials.supabaseUrl ?? ''),
		);

		const apiKey = String(
			credentials.apiKey ?? '',
		);

		if (!supabaseUrl) {
			throw new Error(
				'Supabase URL é obrigatória.',
			);
		}

		if (!apiKey) {
			throw new Error(
				'Supabase API Key é obrigatória.',
			);
		}

		const baseUrl = `${supabaseUrl}/rest/v1`;

		const headers: Record<string, string> = {
			apikey: apiKey,
			Authorization: `Bearer ${apiKey}`,
			Accept: 'application/json',
		};

		const output: INodeExecutionData[] = [];

		/**
		 * Converte os filtros configurados no node
		 * para os parâmetros esperados pelo PostgREST.
		 */
		const getFilters = (
			index: number,
		): Record<string, string> => {
			const raw = this.getNodeParameter(
				'filters',
				index,
				{},
			) as {
				filter?: Filter[];
			};

			const query: Record<string, string> = {};

			for (const filter of raw?.filter ?? []) {
				if (!filter.field) {
					continue;
				}

				const field = String(
					filter.field,
				).trim();

				const operator =
					filter.operator;

				const value = String(
					filter.value ?? '',
				).trim();

				if (operator === 'in') {
					const values = value
						.split(',')
						.map((item) =>
							item.trim(),
						)
						.filter(Boolean);

					query[field] =
						`in.(${values.join(',')})`;

					continue;
				}

				if (operator === 'not') {
					/**
					 * Para NOT o usuário pode informar:
					 *
					 * eq.1001
					 * like.*teste*
					 * in.(1,2,3)
					 */
					query[field] =
						`not.${value}`;

					continue;
				}

				query[field] =
					`${operator}.${value}`;
			}

			return query;
		};

		/**
		 * Função central para requisições ao Supabase.
		 */
		const request = async (
			method:
				| 'GET'
				| 'POST'
				| 'PATCH'
				| 'DELETE',
			requestUrl: string,
			body?:
				| Record<string, unknown>
				| Array<Record<string, unknown>>,
			query?: Record<string, string>,
			extraHeaders?: Record<string, string>,
		) => {
			try {
				return await this.helpers.httpRequest({
					method,
					url: requestUrl,

					headers: {
						...headers,
						...extraHeaders,

						...(method !== 'GET'
							? {
									'Content-Type':
										'application/json',
								}
							: {}),
					},

					qs: query,

					body,

					json: true,
				});
			} catch (error) {
				const err = error as {
					response?: {
						body?: {
							code?: string;
							message?: string;
							details?: string;
							hint?: string;
						};
					};
					message?: string;
				};

				const bodyError =
					err?.response?.body;

				if (bodyError) {
					throw new Error(
						`Supabase${
							bodyError.code
								? ` [${bodyError.code}]`
								: ''
						}: ${
							bodyError.message ??
							'Erro na API'
						}${
							bodyError.details
								? ` Detalhes: ${bodyError.details}`
								: ''
						}${
							bodyError.hint
								? ` Sugestão: ${bodyError.hint}`
								: ''
						}`,
					);
				}

				throw error;
			}
		};

		/**
		 * RPC
		 */
		if (operation === 'rpc') {
			const functionName = String(
				this.getNodeParameter(
					'functionName',
					0,
				),
			).trim();

			if (!functionName) {
				throw new Error(
					'O nome da função RPC é obrigatório.',
				);
			}

			const argumentsData =
				parseJson(
					String(
						this.getNodeParameter(
							'rpcArguments',
							0,
						),
					),
					'Arguments',
				);

			const result = await request(
				'POST',
				`${baseUrl}/rpc/${encodeURIComponent(
					functionName,
				)}`,
				argumentsData as Record<
					string,
					unknown
				>,
			);

			const rows = Array.isArray(
				result,
			)
				? result
				: [result];

			for (const row of rows) {
				output.push({
					json: row as Record<
						string,
						unknown
					>,
				});
			}

			return [output];
		}

		/**
		 * Tabela
		 */
		const table = String(
			this.getNodeParameter(
				'table',
				0,
			),
		).trim();

		if (!table) {
			throw new Error(
				'Nome da tabela é obrigatório.',
			);
		}

		const tableUrl =
			`${baseUrl}/${encodeURIComponent(
				table,
			)}`;

		/**
		 * SELECT
		 */
		if (operation === 'select') {
			const returnAll =
				this.getNodeParameter(
					'returnAll',
					0,
				) as boolean;

			const limit = Math.max(
				1,
				Number(
					this.getNodeParameter(
						'limit',
						0,
					),
				),
			);

			const initialOffset =
				Math.max(
					0,
					Number(
						this.getNodeParameter(
							'offset',
							0,
						),
					),
				);

			const columns = String(
				this.getNodeParameter(
					'columns',
					0,
				) || '*',
			);

			const orderBy = String(
				this.getNodeParameter(
					'orderBy',
					0,
				) || '',
			).trim();

			let offset =
				initialOffset;

			do {
				const query: Record<
					string,
					string
				> = {
					select: columns,
					...getFilters(0),
					limit: String(limit),
					offset: String(offset),
				};

				if (orderBy) {
					query.order = orderBy;
				}

				const result =
					await request(
						'GET',
						tableUrl,
						undefined,
						query,
					);

				const rows =
					Array.isArray(result)
						? result
						: [];

				for (const row of rows) {
					output.push({
						json: row as Record<
							string,
							unknown
						>,
					});
				}

				if (
					!returnAll ||
					rows.length < limit
				) {
					break;
				}

				offset += limit;
			} while (true);

			return [output];
		}

		/**
		 * COUNT
		 *
		 * Usa Content-Range para obter
		 * o total real de registros.
		 */
		if (operation === 'count') {
			const query: Record<
				string,
				string
			> = {
				select: '*',
				...getFilters(0),
				limit: '1',
			};

			try {
				const result =
					await this.helpers.httpRequest({
						method: 'GET',
						url: tableUrl,

						headers: {
							...headers,
							Prefer:
								'count=exact',
						},

						qs: query,

						json: true,

						returnFullResponse: true,
					});

				const responseHeaders =
					(result as {
						headers?: Record<
							string,
							string
						>;
						body?: unknown;
					}).headers ?? {};

				const contentRange =
					responseHeaders[
						'content-range'
					] ??
					responseHeaders[
						'Content-Range'
					];

				let count = 0;

				if (contentRange) {
					const match =
						String(
							contentRange,
						).match(
							/\/(\d+|\*)$/,
						);

					if (match) {
						count = Number(
							match[1],
						);
					}
				}

				output.push({
					json: {
						count,
					},
				});

				return [output];
			} catch (error) {
				const err = error as {
					response?: {
						body?: {
							message?: string;
							code?: string;
							details?: string;
							hint?: string;
						};
					};
				};

				const bodyError =
					err?.response?.body;

				if (bodyError) {
					throw new Error(
						`Supabase${
							bodyError.code
								? ` [${bodyError.code}]`
								: ''
						}: ${
							bodyError.message ??
							'Erro na API'
						}${
							bodyError.details
								? ` Detalhes: ${bodyError.details}`
								: ''
						}${
							bodyError.hint
								? ` Sugestão: ${bodyError.hint}`
								: ''
						}`,
					);
				}

				throw error;
			}
		}

		/**
		 * INSERT / UPSERT
		 */
		if (
			operation === 'insert' ||
			operation === 'upsert'
		) {
			const dataSource =
				String(
					this.getNodeParameter(
						'dataSource',
						0,
					),
				);

			let payload:
				| Record<string, unknown>
				| Array<
						Record<
							string,
							unknown
						>
				  >;

			if (
				dataSource ===
				'inputItems'
			) {
				payload = items.map(
					(item) =>
						item.json as Record<
							string,
							unknown
						>,
				);
			} else {
				const parsed =
					parseJson(
						String(
							this.getNodeParameter(
								'jsonData',
								0,
							),
						),
						'JSON Data',
					);

				if (
					typeof parsed !==
						'object' ||
					parsed === null
				) {
					throw new Error(
						'JSON Data deve conter um objeto ou array JSON.',
					);
				}

				payload =
					parsed as
						| Record<
								string,
								unknown
						  >
						| Array<
								Record<
									string,
									unknown
								>
						  >;
			}

			const returnData =
				this.getNodeParameter(
					'returnData',
					0,
				) as boolean;

			const extraHeaders: Record<
				string,
				string
			> = {
				Prefer: returnData
					? 'return=representation'
					: 'return=minimal',
			};

			const query: Record<
				string,
				string
			> = {};

			if (
				operation === 'upsert'
			) {
				const conflict =
					String(
						this.getNodeParameter(
							'onConflict',
							0,
						) || '',
					).trim();

				const ignoreDuplicates =
					this.getNodeParameter(
						'ignoreDuplicates',
						0,
					) as boolean;

				if (conflict) {
					query.on_conflict =
						conflict;
				}

				extraHeaders.Prefer +=
					ignoreDuplicates
						? ',resolution=ignore-duplicates'
						: ',resolution=merge-duplicates';
			}

			const result =
				await request(
					'POST',
					tableUrl,
					payload,
					query,
					extraHeaders,
				);

			if (returnData) {
				const rows =
					Array.isArray(result)
						? result
						: [result];

				for (const row of rows) {
					output.push({
						json: row as Record<
							string,
							unknown
						>,
					});
				}
			} else {
				output.push({
					json: {
						success: true,
						operation,
					},
				});
			}

			return [output];
		}

		/**
		 * UPDATE / DELETE
		 */
		if (
			operation === 'update' ||
			operation === 'delete'
		) {
			const filterQuery =
				getFilters(0);

			if (
				!Object.keys(
					filterQuery,
				).length
			) {
				throw new Error(
					`${operation.toUpperCase()} exige pelo menos um filtro por segurança.`,
				);
			}

			const returnData =
				this.getNodeParameter(
					'returnData',
					0,
				) as boolean;

			/**
			 * UPDATE
			 */
			if (
				operation === 'update'
			) {
				const dataSource =
					String(
						this.getNodeParameter(
							'dataSource',
							0,
						),
					);

				let payload: Record<
					string,
					unknown
				>;

				if (
					dataSource ===
					'inputItems'
				) {
					payload =
						(items[0]?.json ??
							{}) as Record<
							string,
							unknown
						>;
				} else {
					const parsed =
						parseJson(
							String(
								this.getNodeParameter(
									'jsonData',
									0,
								),
							),
							'JSON Data',
						);

					if (
						typeof parsed !==
							'object' ||
						parsed === null ||
						Array.isArray(parsed)
					) {
						throw new Error(
							'JSON Data para Update deve ser um objeto.',
						);
					}

					payload =
						parsed as Record<
							string,
							unknown
						>;
				}

				const result =
					await request(
						'PATCH',
						tableUrl,
						payload,
						filterQuery,
						{
							Prefer: returnData
								? 'return=representation'
								: 'return=minimal',
						},
					);

				if (returnData) {
					const rows =
						Array.isArray(
							result,
						)
							? result
							: [result];

					for (const row of rows) {
						output.push({
							json: row as Record<
								string,
								unknown
							>,
						});
					}
				} else {
					output.push({
						json: {
							success: true,
							operation:
								'update',
						},
					});
				}

				return [output];
			}

			/**
			 * DELETE
			 */
			const result =
				await request(
					'DELETE',
					tableUrl,
					undefined,
					filterQuery,
					{
						Prefer: returnData
							? 'return=representation'
							: 'return=minimal',
					},
				);

			if (returnData) {
				const rows =
					Array.isArray(result)
						? result
						: [result];

				for (const row of rows) {
					output.push({
						json: row as Record<
							string,
							unknown
						>,
					});
				}
			} else {
				output.push({
					json: {
						success: true,
						operation: 'delete',
					},
				});
			}

			return [output];
		}

		throw new Error(
			`Operação não suportada: ${operation}`,
		);
	}
}