import { scrubEvent, scrubTransaction } from './privacy';
it('removes credentials, messages, form data, HTTP breadcrumbs and frame variables', () => {
  const event = scrubEvent({ message:'secret',request:{url:'https://api.test?token=secret',data:'secret'},user:{email:'secret'},extra:{password:'secret'},
    tags:{ token:'secret',traceId:'request-123' }, contexts:{ navigation:{ token:'secret' }, device:{name:'secret',model:'iPhone'}, trace:{span_id:'span-1',trace_id:'trace-1',data:{token:'secret'}} },
    exception:{values:[{type:'Error',value:'secret',stacktrace:{frames:[{filename:'app.js?token=secret',vars:{password:'secret'},lineno:12}]}}]},
    breadcrumbs:[{ category:'http',data:{token:'secret'} },{category:'ui',message:'secret',data:{token:'secret'}}],
  });
  expect(JSON.stringify(event)).not.toContain('secret'); expect(event.tags).toEqual({traceId:'request-123'});
  expect(event.exception?.values?.[0].stacktrace?.frames?.[0].lineno).toBe(12);
});
it('strips transaction routes and span data', () => {
  const event = scrubTransaction({type:'transaction',transaction:'/verify-email?token=secret',spans:[{op:'http',description:'secret',data:{token:'secret'},span_id:'1',trace_id:'2',start_timestamp:0,timestamp:1}]});
  expect(JSON.stringify(event)).not.toContain('secret');
});
