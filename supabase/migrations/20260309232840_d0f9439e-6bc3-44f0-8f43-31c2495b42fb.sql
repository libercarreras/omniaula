DROP POLICY IF EXISTS "Users can view own materias" ON materias;
DROP POLICY IF EXISTS "Users can insert own materias" ON materias;
DROP POLICY IF EXISTS "Users can update own materias" ON materias;
DROP POLICY IF EXISTS "Users can delete own materias" ON materias;

CREATE POLICY "Users can view own materias" ON materias FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own materias" ON materias FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own materias" ON materias FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own materias" ON materias FOR DELETE TO authenticated USING (auth.uid() = user_id);