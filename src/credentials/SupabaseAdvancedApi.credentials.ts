import type { ICredentialType, INodeProperties } from 'n8n-workflow';
export class SupabaseAdvancedApi implements ICredentialType {
 name='supabaseAdvancedApi'; displayName='Supabase Advanced API'; documentationUrl='https://supabase.com/docs/guides/api';
 properties: INodeProperties[]=[
  {displayName:'Supabase URL',name:'supabaseUrl',type:'string',default:'',placeholder:'https://your-project.supabase.co',required:true},
  {displayName:'API Key',name:'apiKey',type:'string',typeOptions:{password:true},default:'',required:true}
 ];
}
