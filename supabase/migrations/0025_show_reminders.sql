-- ============================================================
-- 공연 전날 리마인드 + 끝난 뒤 리뷰 요청.
--
-- 지금 관객이 참석 예정을 눌러도 그 공연으로 오는 알림은 '취소될 때' 하나뿐입니다.
--
--   · 전날 리마인드가 없어서 까먹고 안 옵니다. 노쇼는 호스트에게 그대로
--     "앱에서 8명이 온다더니 3명 왔다"로 남고, 그러면 다음 공연을 안 엽니다.
--   · 리뷰 요청이 없어서 리뷰가 안 쌓입니다. 리뷰는 다음 호스트를 설득하는
--     유일한 증거인데, 쓸 시점을 아무도 알려주지 않았습니다.
--
-- ★ 앱 안 알림으로만 보냅니다. 푸시나 카카오톡은 여기서 못 합니다 — 카카오
--   토큰은 로그인 직후 sessionStorage 에만 있고 서버에 저장하지 않습니다.
--   그건 별도 결정이 필요한 일이고, 그 전에도 알림함은 채워져야 합니다.
--
-- ★ 같은 공연으로 두 번 보내지 않습니다. 표를 새로 만들지 않고 notifications
--   자체를 봅니다 — link 에 공연 id 가 들어 있어서 (type, link, user_id) 로
--   판별됩니다. 기록을 두 군데 두면 반드시 어긋납니다.
-- ============================================================

-- 중복 판정을 매번 전체 훑지 않도록
create index if not exists notifications_dedupe_idx
  on public.notifications (user_id, type, link);

-- ─────────── ① 공연 전날 리마인드 ───────────
--
-- ★ '내일 하는 공연'으로 고릅니다. 시간 차(지금부터 24시간 이내)로 잡으면
--   크론이 한 번 밀릴 때 그 공연은 영영 알림을 못 받습니다. 날짜로 고르면
--   그날 안에 언제 돌든 같은 결과입니다.

create or replace function public.fn_notify_show_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sent integer := 0;
begin
  with target as (
    insert into public.notifications (user_id, type, title, body, link)
    select
      a.user_id,
      'show_reminder',
      '내일 공연이 있어요',
      s.title || ' · ' ||
        to_char(s.starts_at at time zone 'Asia/Seoul', 'HH24:MI') || ' · ' ||
        coalesce(v.name, '공간'),
      '/audience/show/' || s.id
    from public.shows s
    join public.venues v on v.id = s.venue_id
    join public.attendances a on a.show_id = s.id and a.status <> 'canceled'
    where s.source = 'own'
      and s.canceled_at is null
      and s.status <> 'canceled'
      and (s.starts_at at time zone 'Asia/Seoul')::date
          = ((now() at time zone 'Asia/Seoul')::date + 1)
      and not exists (
        select 1 from public.notifications n
        where n.user_id = a.user_id
          and n.type = 'show_reminder'
          and n.link = '/audience/show/' || s.id
      )
    returning 1
  )
  select count(*) into v_sent from target;

  return v_sent;
end;
$$;

comment on function public.fn_notify_show_reminders is
  '내일 열리는 우리 무대의 참석 예정자에게 리마인드. 같은 공연으로 두 번 보내지 않습니다.';

-- ─────────── ② 끝난 뒤 리뷰 요청 ───────────
--
-- ★ 이미 리뷰를 쓴 사람에게는 보내지 않습니다. 다 쓴 사람에게 "리뷰를 남겨
--   주세요"가 오면 서비스가 자기가 받은 걸 모르는 것처럼 보입니다.
--
-- ★ 끝난 지 사흘까지 봅니다. 크론이 하루 밀려도 놓치지 않고, 중복 판정이
--   있으니 매일 돌아도 한 번만 갑니다.
--
-- ★ 공간·아티스트 두 종류 리뷰가 있는데, 둘 중 하나라도 썼으면 보내지
--   않습니다. 한쪽만 쓰고 그만두는 것도 그 사람의 선택입니다.

create or replace function public.fn_notify_review_requests()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sent integer := 0;
begin
  with target as (
    insert into public.notifications (user_id, type, title, body, link)
    select
      a.user_id,
      'review_request',
      '어제 공연 어떠셨어요?',
      s.title || ' · 짧은 한 줄이 다음 무대를 만듭니다',
      '/audience/review/' || s.id
    from public.shows s
    join public.attendances a on a.show_id = s.id and a.status <> 'canceled'
    where s.source = 'own'
      and s.canceled_at is null
      and s.status <> 'canceled'
      and s.starts_at + make_interval(mins => s.duration_min) < now()
      and s.starts_at > now() - interval '3 days'
      and not exists (
        select 1 from public.reviews r
        where r.show_id = s.id and r.user_id = a.user_id
      )
      and not exists (
        select 1 from public.notifications n
        where n.user_id = a.user_id
          and n.type = 'review_request'
          and n.link = '/audience/review/' || s.id
      )
    returning 1
  )
  select count(*) into v_sent from target;

  return v_sent;
end;
$$;

comment on function public.fn_notify_review_requests is
  '끝난 우리 무대의 참석자에게 리뷰 요청. 이미 쓴 사람과 이미 받은 사람은 제외합니다.';

-- ─────────── ★ 권한: 아무나 부르지 못하게 ───────────
--
-- ★ Postgres 함수는 기본적으로 PUBLIC 에 EXECUTE 가 열려 있고, PostgREST 는
--   public 스키마의 함수를 전부 /rest/v1/rpc/<이름> 으로 노출합니다.
--   거기에 security definer 가 붙으면, anon 키만 있는 아무나가 관리자 권한으로
--   그 함수를 돌릴 수 있습니다.
--
-- ★ 실제로 열려 있었습니다. 확인한 결과:
--     POST /rest/v1/rpc/fn_prune_past_kopis   -> HTTP 200
--     POST /rest/v1/rpc/fn_prune_client_errors -> HTTP 204
--   fn_prune_past_kopis 는 공연을 지우는 함수입니다. anon 키는 프론트에
--   노출되는 것이 정상이므로, 이건 누구나 남의 서비스에서 공연을 지울 수
--   있었다는 뜻입니다.
--
-- ★ 유지보수·알림 함수는 크론(테이블 소유자)만 부르면 됩니다. 사람이 부를
--   일이 없으니 전부 회수합니다. 사용자가 직접 부르는 함수
--   (fn_accept_application, fn_cancel_show, fn_delete_my_account)는
--   authenticated 에게만 열려 있고 함수 안에서 auth.uid() 를 다시 확인하므로
--   그대로 둡니다.

revoke all on function public.fn_notify_show_reminders() from public, anon, authenticated;
revoke all on function public.fn_notify_review_requests() from public, anon, authenticated;
revoke all on function public.fn_prune_past_kopis() from public, anon, authenticated;
revoke all on function public.fn_prune_client_errors() from public, anon, authenticated;
revoke all on function public.fn_notify_saved_searches() from public, anon, authenticated;

-- ─────────── 자동 실행 ───────────
--
-- ★ 저녁 7시(KST)에 보냅니다. 아침에 "내일 공연 있어요"는 하루 종일 잊히고,
--   밤 11시는 늦습니다. 저녁에 다음 날 일정을 정리하는 시간에 맞춥니다.
--   19:00 KST = 10:00 UTC.

create extension if not exists pg_cron;

select cron.unschedule('show-reminders')
where exists (select 1 from cron.job where jobname = 'show-reminders');

select cron.schedule(
  'show-reminders',
  '0 10 * * *',
  $job$ select public.fn_notify_show_reminders(); $job$
);

-- 리뷰 요청은 오전 11시(KST = 02:00 UTC). 어젯밤 공연을 아침에 떠올리게 합니다.
select cron.unschedule('review-requests')
where exists (select 1 from cron.job where jobname = 'review-requests');

select cron.schedule(
  'review-requests',
  '0 2 * * *',
  $job$ select public.fn_notify_review_requests(); $job$
);
