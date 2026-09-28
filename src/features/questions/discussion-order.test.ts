import { discussionPreview, orderDiscussion } from './discussion-order';

it('places replies by comment id even when authors have the same name', () => {
  const first = {id:'one',authorName:'Üye'}, second = {id:'two',authorName:'Üye'};
  const reply = {id:'reply',replyToId:'one',authorName:'Başka üye'};
  expect(orderDiscussion([first,second],[reply]).map(item=>item.id)).toEqual(['one','reply','two']);
});

it('deduplicates reloaded replies and prefers the latest server body', () => {
  expect(orderDiscussion([{id:'reply',body:'Düzenlendi'}],[{id:'reply',body:'İlk metin'}]))
    .toEqual([{id:'reply',body:'Düzenlendi'}]);
});

it('keeps the preview bounded while including a new reply with its parent', () => {
  const loaded = Array.from({length:20},(_,index)=>({id:String(index)}));
  const created = [{id:'new',replyToId:'4'}];
  const preview = discussionPreview(orderDiscussion(loaded,created),created);
  expect(preview.map(item=>item.id)).toEqual(['0','1','2','3','4','new']);
  expect(preview.length).toBeLessThan(23); // Remaining server rows still need the full-discussion link.
});
