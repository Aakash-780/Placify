-- Insert channel pattern for realtime notifications
INSERT INTO realtime.channels (pattern, description, enabled)
VALUES ('notifications:%', 'Real-time notifications for users', true)
ON CONFLICT (pattern) DO NOTHING;

-- Create function to notify notification changes
CREATE OR REPLACE FUNCTION notify_notification_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.publish(
    'notifications:' || NEW.user_id::text,    -- channel name
    'new_notification',                       -- event name
    jsonb_build_object(
      'id', NEW.id,
      'user_id', NEW.user_id,
      'title', NEW.title,
      'message', NEW.message,
      'type', NEW.type,
      'is_read', NEW.is_read,
      'created_at', NEW.created_at,
      'entity_type', NEW.entity_type,
      'entity_id', NEW.entity_id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to notifications table
DROP TRIGGER IF EXISTS notification_realtime ON notifications;
CREATE TRIGGER notification_realtime
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_notification_changes();
