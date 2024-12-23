DELETE FROM project
WHERE
    id IN (
        SELECT
            id
        FROM
            (
                SELECT
                    id,
                    ROW_NUMBER() OVER (
                        PARTITION BY
                            user_id,
                            handle
                        ORDER BY
                            created_at DESC
                    ) as rn
                FROM
                    project
            ) t
        WHERE
            rn > 1
    );

CREATE UNIQUE INDEX "unique_project_handle_per_user" ON "project" USING btree ("user_id", "handle");
